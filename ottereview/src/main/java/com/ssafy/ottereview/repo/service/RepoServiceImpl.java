package com.ssafy.ottereview.repo.service;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.branch.service.BranchServiceImpl;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.dto.RepoUpdateRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepoServiceImpl implements RepoService {

    private final RepoRepository repoRepository;
    private final AccountRepository accountRepository;
    private final GithubApiClient githubApiClient;
    private final BranchServiceImpl branchService;
    private final UserAccountRepository userAccountRepository;

    private final PullRequestService pullRequestService;

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

        return repoRepository.findAllByAccount_Id(accountId)
                .stream()
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
    public List<RepoResponse> getReposByUserId(User user) {
        List<UserAccount> userAccounts = userAccountRepository.findAllByUser(user);
        List<Account> accountList = userAccounts.stream().map(UserAccount::getAccount).toList();
        List<Repo> repoList = accountList.stream()
                .flatMap(account -> repoRepository.findAllByAccount(account).stream())
                .distinct()
                .toList();
        return repoList.stream().map(RepoResponse::of).toList();
    }

    @Transactional
    @Override
    public void processSyncRepo(Account account, Long installationId) {
        // github에서 installation ID에 설치된 레포리스트를 가져오는 메소드
        List<GHRepository> repositories = githubApiClient.getRepositories(installationId);

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

        // 삭제하는 로직 (github 리스트안에 없는건 삭제해야하기 때문에)
        // 삭제를 먼저하는 이유는 삭제를 하고나면 branch까지 싹다 없어지기 때문에 관리하기가 훨씬 편하다.
        // cashcade 때문에 사라질 것이다.
        deleteRepoList(remoteSet, dbRepoSet, account);

        // github에서 가져온 레포지토리 리스트 우리 db에 저장하는 로직
        createRepoList(remoteSet, dbRepoSet, repoMap, account);


    }

    @Override
    public void createRepoList(Set<Long> remoteSet, Set<Long> dbRepoSet,
            Map<Long, GHRepository> repoMap, Account account) {
        List<Branch> branchesToSave = new ArrayList<>();
        List<GHRepository> ghRepositoriesToCreate = new ArrayList<>(); // 추가

        List<Repo> toCreate = remoteSet.stream()
                .filter(id -> !dbRepoSet.contains(id))
                .map(id -> {
                    GHRepository gh = repoMap.get(id);
                    ghRepositoriesToCreate.add(gh);
                    Repo repo = Repo.builder()
                            .repoId(id)
                            .fullName(gh.getFullName())
                            .isPrivate(gh.isPrivate())
                            .account(account)
                            .build();
                    branchesToSave.addAll(branchService.createBranchList(gh, repo));
                    return repo;
                })
                .toList();

        if (!toCreate.isEmpty()) {
            repoRepository.saveAll(toCreate);
            pullRequestService.createPullRequestFromGithubRepository(ghRepositoriesToCreate);
        }
        // branch에 branchList 한번에 저장하는 로직
        branchService.saveAllBranchList(branchesToSave);
    }

    @Override
    public void deleteRepoList(Set<Long> remoteSet, Set<Long> dbRepoSet, Account account) {
        List<Long> toDelete = dbRepoSet.stream()
                .filter(id -> !remoteSet.contains(id))
                .toList();

        if (!toDelete.isEmpty()) {
            repoRepository.deleteByAccount_IdAndRepoIdIn(account.getId(), toDelete);
        }
    }

    @Transactional
    @Override
    public List<UserAccount> getUserListByRepoId(Long repoId) {
        // repoId 기반으로 같은 Account를 가져옵니다.
        Repo repo = repoRepository.findByRepoId(repoId);
        return userAccountRepository.findAllByAccount(repo.getAccount());
    }


}
