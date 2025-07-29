package com.ssafy.ottereview.repo.service;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.githubapp.dto.GithubRepoResponse;
import com.ssafy.ottereview.githubapp.util.GithubAppUtil;
import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.dto.RepoUpdateRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.repository.UserRepository;
import com.ssafy.ottereview.userreporelation.entity.UserRepoRelation;
import com.ssafy.ottereview.userreporelation.repository.UserRepoRelationRepository;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.juli.logging.Log;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.PagedIterable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepoServiceImpl implements RepoService{
    private final UserRepoRelationRepository userRepoRelationRepository;
    private final RepoRepository repoRepository;
    private final AccountRepository accountRepository;
    private final GithubAppUtil githubAppUtil;

    @Transactional
    @Override
    public List<RepoResponse> syncReposForAccount(Long accountId) {
            // account 객체도 생성 (추후에 저장하기 위한 repo 객체를 만들기 위해서)
            Account account = accountRepository.getReferenceById(accountId);
            // accountId를 통해서 InstallationId를 뽑아서 그걸로 githubRepoResponse를 반환한다.
            Long installationId = accountRepository.findById(accountId)
                    .orElseThrow(() -> new EntityNotFoundException("Account not found"))
                    .getInstallationId();
            // 동기화 작업 해주는 로직
            processSyncRepo(account, installationId);

        return repoRepository.findAllByAccount_Id(accountId).stream()
                .map(RepoResponse::of)
                .toList();
    }

    @Override
    public Optional<Repo> getById(Long id) {
        return repoRepository.findById(id);
    }

    @Override
    public void createRepo(RepoCreateRequest repoCreateRequest) {
        // repoCreateRequest 객체에 담긴 내용을 토대로 repo를 만들어서 db에 저장한다.
        Repo repo = Repo.builder()
                .repoId(repoCreateRequest.getRepoId())
                .fullName(repoCreateRequest.getFullName())
                .isPrivate(repoCreateRequest.isPrivate())
                .account(repoCreateRequest.getAccount())
                .build();

        // db에 저장
        repoRepository.save(repo);

    }

    @Transactional
    @Override
    public void updateRepo(RepoUpdateRequest repoUpdateRequest) {
        // Request에 저장된 Id값을 가지고 db에 저장된 repo 불러오기
        Repo repo = repoRepository.findById(repoUpdateRequest.getRepoId())
                .orElseThrow(() -> new IllegalArgumentException("Not Found"));

        // 변경내용 repo에 바꿔서 넣기
        repo.enrollAccount(repoUpdateRequest.getAccount());
        repo.changeOpenType(repoUpdateRequest.isPrivate());
        repo.cushionToggle(repoUpdateRequest.isCushion());

        // 명시적 save() 호출
        Repo updated = repoRepository.save(repo);

    }

    @Override
    public void deleteRepo(Long id) {
        repoRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RepoResponse> getReposByUserId(Long userId) {
        return userRepoRelationRepository.findByUser_Id(userId).stream()
                .map(UserRepoRelation::getRepo)          // 이 시점엔 세션 열려 있음
                .map(RepoResponse::of)                  // DTO 변환도 여기서!
                .collect(Collectors.toList());

    }
    @Transactional
    @Override
    public void processSyncRepo(Account account, Long installationId) {
        try {
            GitHub github = githubAppUtil.getGitHub(installationId);
            List<GHRepository> repositories = github.getInstallation()
                    .listRepositories()
                    .toList();

            // log 확인용
            for (GHRepository repo : repositories) {
                log.info("Repo ID: {}, Full Name: {}, Private: {}",
                        repo.getId(), repo.getFullName(), repo.isPrivate());
            }

            Map<Long, GHRepository> repoMap = repositories.stream()
                    .collect(Collectors.toMap(
                            GHRepository::getId,      // 키: GitHub이 부여한 고유 ID
                            Function.identity()       // 값: GHRepository 객체 자체
                    ));
            Set<Long> remoteSet = repoMap.keySet();

            // accountId를 가지고 repoId List 가져오기
            List<Long> dbRepoList = repoRepository.findRepoIdsByAccountId(account.getId());
            Set<Long> dbRepoSet = new HashSet<>(dbRepoList);

            List<Repo> toCreate = remoteSet.stream()
                    .filter(id -> !dbRepoSet.contains(id))
                    .map(id -> {
                        GHRepository gh = repoMap.get(id);
                        return Repo.builder()
                                .repoId(id)
                                .fullName(gh.getFullName())
                                .isPrivate(gh.isPrivate())
                                .account(account)
                                .build();
                    }).toList();
            // log 확인용
            for (Repo repo : toCreate) {
                log.info("repo에 넣을 create값 출력");
                log.info("Repo ID: {}, Full Name: {}, Private: {}",
                        repo.getRepoId(), repo.getFullName(), repo.isPrivate());
            }
            List<Long> toDelete = dbRepoSet.stream().filter(id -> !remoteSet.contains(id)).toList();
            if (!toCreate.isEmpty()) {
                repoRepository.saveAll(toCreate);
            }
            if (!toDelete.isEmpty()) {
                repoRepository.deleteByAccount_IdAndRepoIdIn(account.getId(), toDelete);
            }
        }catch(IOException e){
            e.printStackTrace();
        }

    }
}
