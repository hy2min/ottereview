package com.ssafy.ottereview.repo.service;

import com.ssafy.ottereview.account.entity.Account;
import com.ssafy.ottereview.account.entity.UserAccount;
import com.ssafy.ottereview.account.repository.AccountRepository;
import com.ssafy.ottereview.account.repository.UserAccountRepository;
import com.ssafy.ottereview.branch.entity.Branch;
import com.ssafy.ottereview.branch.service.BranchServiceImpl;
import com.ssafy.ottereview.common.exception.BusinessException;
import com.ssafy.ottereview.common.exception.ErrorCode;
import com.ssafy.ottereview.githubapp.client.GithubApiClient;
import com.ssafy.ottereview.pullrequest.service.PullRequestService;
import com.ssafy.ottereview.repo.dto.RepoCreateRequest;
import com.ssafy.ottereview.repo.dto.RepoResponse;
import com.ssafy.ottereview.repo.dto.RepoUpdateRequest;
import com.ssafy.ottereview.repo.entity.Repo;
import com.ssafy.ottereview.repo.exception.RepoErrorCode;
import com.ssafy.ottereview.repo.repository.RepoRepository;
import com.ssafy.ottereview.user.entity.User;
import jakarta.persistence.EntityNotFoundException;

import java.util.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.kohsuke.github.GHRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

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
        // 입력값 검증
        if (accountId == null || accountId <= 0) {
            throw new BusinessException(RepoErrorCode.INVALID_ACCOUNT_ID);
        }
        try {
            // account 객체도 생성 (추후에 저장하기 위한 repo 객체를 만들기 위해서)
            Account account = accountRepository.getReferenceById(accountId);
            // accountId를 통해서 InstallationId를 뽑아서 그걸로 githubRepoResponse를 반환한다.
            Long installationId = accountRepository.findById(accountId)
                    .orElseThrow(() -> new BusinessException(RepoErrorCode.REPO_NOT_FOUND))
                    .getInstallationId();
            // 동기화 작업 해주는 로직
            processSyncRepo(account, installationId);

            return repoRepository.findAllByAccount_Id(accountId)
                    .stream()
                    .map(RepoResponse::fromEntity)
                    .toList();
        } catch (BusinessException e) {
            log.error("Business error during repo sync for accountId: {}", accountId, e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error during repo sync for accountId: {}", accountId, e);
            throw new BusinessException(RepoErrorCode.DATABASE_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error during repo sync for accountId: {}", accountId, e);
            throw new BusinessException(RepoErrorCode.REPO_SYNC_FAILED);
        }

    }

    @Override
    public Optional<Repo> getById(Long id) {
        return repoRepository.findById(id);
    }

    @Override
    public void createRepo(RepoCreateRequest repoCreateRequest) {
        // repoCreateRequest 객체에 담긴 내용을 토대로 repo를 만들어서 db에 저장한다.

        // 중복 검사
        try {
            boolean exists = repoRepository.existsByRepoIdAndAccount(
                    repoCreateRequest.getRepoId(),
                    repoCreateRequest.getAccount()
            );
            if (exists) {
                throw new BusinessException(RepoErrorCode.REPO_ALREADY_EXISTS);
            }


            Repo repo = Repo.builder()
                    .repoId(repoCreateRequest.getRepoId())
                    .fullName(repoCreateRequest.getFullName())
                    .isPrivate(repoCreateRequest.isPrivate())
                    .account(repoCreateRequest.getAccount())
                    .build();

            // db에 저장
            repoRepository.save(repo);
            log.info("Successfully created repo with id: {}", repo.getRepoId());
        } catch (BusinessException e) {
            log.error("Business error during repo creation", e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error during repo creation", e);
            throw new BusinessException(RepoErrorCode.REPO_CREATE_FAILED);
        } catch (Exception e) {
            log.error("Unexpected error during repo creation", e);
            throw new BusinessException(RepoErrorCode.REPO_CREATE_FAILED);
        }
    }

    @Transactional
    @Override
    public void updateRepo(RepoUpdateRequest repoUpdateRequest) {
        // Request에 저장된 Id값을 가지고 db에 저장된 repo 불러오기
        Repo repo = repoRepository.findById(repoUpdateRequest.getRepoId())
                .orElseThrow(() -> new BusinessException(RepoErrorCode.REPO_NOT_FOUND));

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
        if (user == null) {
            throw new BusinessException(RepoErrorCode.INVALID_USER);
        }
        try {
            List<UserAccount> userAccounts = userAccountRepository.findAllByUser(user);
            if (CollectionUtils.isEmpty(userAccounts)) {
                return Collections.emptyList();
            }

            List<Account> accountList = userAccounts.stream().map(UserAccount::getAccount).toList();
            List<Repo> repoList = accountList.stream()
                    .flatMap(account -> repoRepository.findAllByAccount(account).stream())
                    .distinct()
                    .toList();
            return repoList.stream().map(RepoResponse::fromEntity).toList();
        }catch(DataAccessException e) {
            log.error("Database error while getting repos for user: {}", user.getId(), e);
            throw new BusinessException(RepoErrorCode.DATABASE_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error while getting repos for user: {}", user.getId(), e);
            throw new BusinessException(RepoErrorCode.REPO_FETCH_FAILED);
        }
    }

    @Transactional
    @Override
    public void processSyncRepo(Account account, Long installationId) {
        if (account == null || installationId == null) {
            throw new BusinessException(RepoErrorCode.INVALID_SYNC_PARAMETERS);
        }
        try {
            // github에서 installation ID에 설치된 레포리스트를 가져오는 메소드
            List<GHRepository> repositories = githubApiClient.getRepositories(installationId);
            if (repositories == null) {
                log.warn("No repositories returned from GitHub for installationId: {}", installationId);
                return;
            }
            // log 확인용
            for (GHRepository repo : repositories) {
                log.info("Repo ID: {}, Full Name: {}, Private: {}",
                        repo.getId(), repo.getFullName(), repo.isPrivate());
            }

            log.info("createRepo List 시작 지점1");
            // github에서 가져온 레포지토리 리스트 우리 db에 저장하는 로직
            createRepoList(repositories, account);
        }catch(BusinessException e) {
            log.error("Business error during repo sync process", e);
            throw e;
        } catch (Exception e) {
            log.error("GitHub API error during repo sync", e);
            throw new BusinessException(RepoErrorCode.GITHUB_API_ERROR);
        }


    }

    @Transactional
    @Override
    public void createRepoList(List<GHRepository> repoMap, Account account) {
        if (CollectionUtils.isEmpty(repoMap) || account == null) {
            log.warn("Invalid parameters for createRepoList");
            return;
        }
        try {
            // Version 2 -> 처음 App에 install할때
            List<Branch> branchesToSave = new ArrayList<>();
            List<Repo> repoList = repoMap.stream().map(r -> {
                try {
                    Repo repo = Repo.builder().repoId(r.getId()).fullName(r.getFullName()).isPrivate(r.isPrivate()).account(account).build();
                    branchesToSave.addAll(branchService.createBranchList(r, repo));
                    return repo;
                }catch(Exception e){
                    log.error("Error processing repository: {}", r.getFullName(), e);
                    throw new BusinessException(RepoErrorCode.REPO_PROCESSING_ERROR);
                }
            }).toList();

            // repoList 저장
            repoRepository.saveAll(repoList);
            // branchList 저장
            branchService.saveAllBranchList(branchesToSave);
            // pullRequestList 저장
            pullRequestService.createPullRequestFromGithub(repoMap);
            log.info("Successfully created {} repositories with branches and PRs", repoList.size());

        }catch (BusinessException e) {
            log.error("Business error during repo list creation", e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error during repo list creation", e);
            throw new BusinessException(RepoErrorCode.REPO_BATCH_CREATE_FAILED);
        } catch (Exception e) {
            log.error("Unexpected error during repo list creation", e);
            throw new BusinessException(RepoErrorCode.REPO_BATCH_CREATE_FAILED);
        }


    }

    @Override
    @Transactional
    public void updateRepoList(List<GHRepository> repoMap, Account account) {
        // 유효성 검사 (Null 값 계산)
        if (CollectionUtils.isEmpty(repoMap) || account == null) {
            log.warn("Invalid parameters for updateRepoList");
            return;
        }
        try {
            List<Branch> branchesToSave = new ArrayList<>();
            // repoId를 accountId를 토대로 List를 가져온다.
            List<Long> dbRepoList = repoRepository.findRepoIdsByAccountId(account.getId());
            Set<Long> dbRepoSet = new HashSet<>(dbRepoList);
            // 추가할때 원래 있던 레포지토리가 있으면 제외하고 List에 담는다.
            List<Repo> repoList = repoMap.stream()
                    .filter(id -> !dbRepoSet.contains(id.getId()))
                    .map(r -> {
                        try {
                            Repo repo = Repo.builder().repoId(r.getId()).fullName(r.getFullName()).isPrivate(r.isPrivate()).account(account).build();
                            branchesToSave.addAll(branchService.createBranchList(r, repo));
                            return repo;
                        }catch(Exception e){
                            log.error("Error processing repository update: {}", r.getFullName(), e);
                            throw new BusinessException(RepoErrorCode.REPO_PROCESSING_ERROR);
                        }
                    }).toList();
            // repoList 저장
            if (!repoList.isEmpty()) {
                repoRepository.saveAll(repoList);
                // branchList 저장
                branchService.saveAllBranchList(branchesToSave);
                // pullRequestList 저장
                pullRequestService.createPullRequestFromGithub(repoMap);

                log.info("Successfully updated {} new repositories", repoList.size());
            }else{
                log.info("No new repositories to update");
            }
        }catch(BusinessException e) {
            log.error("Business error during repo list update", e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error during repo list update", e);
            throw new BusinessException(RepoErrorCode.REPO_BATCH_UPDATE_FAILED);
        } catch (Exception e) {
            log.error("Unexpected error during repo list update", e);
            throw new BusinessException(RepoErrorCode.REPO_BATCH_UPDATE_FAILED);
        }
    }


    @Override
    @Transactional
    public void deleteRepoList(Set<Long> remoteSet, Set<Long> dbRepoSet, Account account) {
        if (remoteSet == null || dbRepoSet == null || account == null) {
            throw new BusinessException(RepoErrorCode.INVALID_DELETE_PARAMETERS);
        }
        try {
            List<Long> toDelete = dbRepoSet.stream()
                    .filter(id -> !remoteSet.contains(id))
                    .toList();
            log.info("repo를 다 삭제합니다!!!");
            if (!toDelete.isEmpty()) {
                repoRepository.deleteByAccount_IdAndRepoIdIn(account.getId(), toDelete);
            }
        }catch (DataAccessException e) {
            log.error("Database error during repo deletion", e);
            throw new BusinessException(RepoErrorCode.REPO_BATCH_DELETE_FAILED);
        } catch (Exception e) {
            log.error("Unexpected error during repo deletion", e);
            throw new BusinessException(RepoErrorCode.REPO_BATCH_DELETE_FAILED);
        }
    }

    @Transactional
    @Override
    public List<User> getUserListByRepoId(Long repoId) {
        if (repoId == null || repoId <= 0) {
            throw new BusinessException(RepoErrorCode.INVALID_REPO_ID);
        }
        try {
            // repoId 기반으로 같은 Account를 가져옵니다.
            Repo repo = repoRepository.findById(repoId).orElseThrow();
            List<UserAccount> userAccountList = userAccountRepository.findAllByAccount(repo.getAccount());
            List<User> users = userAccountList.stream()
                    .map(UserAccount::getUser)
                    .toList();
            return users;
        } catch (BusinessException e) {
            log.error("Business error while getting users for repo: {}", repoId, e);
            throw e;
        } catch (DataAccessException e) {
            log.error("Database error while getting users for repo: {}", repoId, e);
            throw new BusinessException(RepoErrorCode.DATABASE_ERROR);
        } catch (Exception e) {
            log.error("Unexpected error while getting users for repo: {}", repoId, e);
            throw new BusinessException(RepoErrorCode.USER_FETCH_FAILED);
        }
    }


}
