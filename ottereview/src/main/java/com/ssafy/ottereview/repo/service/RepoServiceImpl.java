package com.ssafy.ottereview.repo.service;

import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.dto.RepoUpdateRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.userreporelation.entity.UserRepoRelation;
import com.ssafy.ottereview.userreporelation.repository.UserRepoRelationRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RepoServiceImpl implements RepoService{
    private final UserRepoRelationRepository userRepoRelationRepository;
    private final RepoRepository repoRepository;


    @Override
    public Optional<Repo> getById(Long id) {
        return repoRepository.findById(id);
    }

    @Override
    public void createRepo(RepoCreateRequest repoCreateRequest) {
        // repoCreateRequest 객체에 담긴 내용을 토대로 repo를 만들어서 db에 저장한다.
        Repo repo = Repo.builder()
                .githubRepoName(repoCreateRequest.getGithubRepoName())
                .githubOwnerUsername(repoCreateRequest.getGithubOwnerUsername())
                .isPrivate(repoCreateRequest.isPrivate())
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
}
