package com.ssafy.ottereview.description.service;

import com.ssafy.ottereview.ai.client.AiClient;
import com.ssafy.ottereview.description.dto.DescriptionBulkCreateRequest;
import com.ssafy.ottereview.description.dto.DescriptionCreateRequest;
import com.ssafy.ottereview.description.dto.DescriptionResponse;
import com.ssafy.ottereview.description.dto.DescriptionUpdateRequest;
import com.ssafy.ottereview.description.entity.Description;
import com.ssafy.ottereview.description.repository.DescriptionRepository;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import com.ssafy.ottereview.s3.service.S3ServiceImpl;
import com.ssafy.ottereview.user.entity.User;
import com.ssafy.ottereview.user.repository.UserRepository;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@RequiredArgsConstructor
@Service
public class DescriptionServiceImpl implements DescriptionService {

    private final DescriptionRepository descriptionRepository;
    private final UserRepository userRepository;
    private final PullRequestRepository pullRequestRepository;
    private final S3ServiceImpl s3Service;
    private final AiClient aiClient;

    @Override
    @Transactional
    public DescriptionResponse createDescription(DescriptionCreateRequest request, Long userId, MultipartFile file) {
        log.info("Description 생성 시작 - PullRequest: {}, User: {}", request.getPullRequestId(), userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        PullRequest pullRequest = pullRequestRepository.findById(request.getPullRequestId())
                .orElseThrow(() -> new IllegalArgumentException("PullRequest not found: " + request.getPullRequestId()));

        Description description;

        if (file != null && !file.isEmpty()) {
            // AI 처리와 S3 업로드를 병렬로 수행
            Mono<String> aiProcessing = aiClient.processAudioFile(file);
            Mono<String> s3Upload = Mono.fromCallable(() -> 
                s3Service.uploadFile(file, request.getPullRequestId())
            ).subscribeOn(Schedulers.boundedElastic());

            var result = Mono.zip(aiProcessing, s3Upload).block();
            
            description = Description.builder()
                    .pullRequest(pullRequest)
                    .user(user)
                    .path(request.getPath())
                    .body(result.getT1()) // AI 처리된 텍스트
                    .recordKey(result.getT2()) // S3 키
                    .position(request.getPosition())
                    .line(request.getLine())
                    .side(request.getSide())
                    .startLine(request.getStartLine())
                    .startSide(request.getStartSide())
                    .diffHunk(request.getDiffHunk())
                    .build();
        } else {
            description = Description.builder()
                    .pullRequest(pullRequest)
                    .user(user)
                    .path(request.getPath())
                    .body(request.getBody())
                    .position(request.getPosition())
                    .line(request.getLine())
                    .side(request.getSide())
                    .startLine(request.getStartLine())
                    .startSide(request.getStartSide())
                    .diffHunk(request.getDiffHunk())
                    .build();
        }

        Description savedDescription = descriptionRepository.save(description);
        log.info("Description 생성 완료 - ID: {}", savedDescription.getId());

        return DescriptionResponse.from(savedDescription);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public List<DescriptionResponse> createDescriptionsBulk(DescriptionBulkCreateRequest request, Long userId, MultipartFile[] files) {
        log.info("Description 일괄 생성 시작 - PullRequest: {}, User: {}, 설명 수: {}, 파일 수: {}",
                request.getPullRequestId(), userId, 
                request.getDescriptions() != null ? request.getDescriptions().size() : 0,
                files != null ? files.length : 0);

        // null이나 빈 리스트 처리
        if (request.getDescriptions() == null || request.getDescriptions().isEmpty()) {
            log.info("Description 목록이 비어있음 - 빈 리스트 반환");
            return Collections.emptyList();
        }

        List<String> uploadedFileKeys = Collections.synchronizedList(new ArrayList<>());

        try {
            // 엔티티 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
            PullRequest pullRequest = pullRequestRepository.findById(request.getPullRequestId())
                    .orElseThrow(() -> new IllegalArgumentException("PullRequest not found: " + request.getPullRequestId()));

            // 모든 설명을 병렬로 처리 (ReviewCommentService 패턴을 따름)
            List<Description> descriptions = Flux.fromIterable(request.getDescriptions())
                    .flatMap(descriptionItem -> {
                        // 파일이 있으면 AI 처리 + S3 업로드, 없으면 바로 설명 생성
                        if (descriptionItem.getFileIndex() != null && files != null &&
                                descriptionItem.getFileIndex() < files.length) {

                            MultipartFile file = files[descriptionItem.getFileIndex()];
                            if (file != null && !file.isEmpty()) {
                                // AI 처리와 S3 업로드를 병렬로
                                Mono<String> aiProcessing = aiClient.processAudioFile(file);
                                Mono<String> s3Upload = Mono.fromCallable(() -> {
                                    String key = s3Service.uploadFile(file, request.getPullRequestId());
                                    uploadedFileKeys.add(key);
                                    return key;
                                }).subscribeOn(Schedulers.boundedElastic());

                                return Mono.zip(aiProcessing, s3Upload)
                                        .map(tuple -> Description.builder()
                                                .pullRequest(pullRequest)
                                                .user(user)
                                                .path(descriptionItem.getPath())
                                                .body(tuple.getT1()) // AI 처리된 텍스트
                                                .recordKey(tuple.getT2()) // S3 키
                                                .position(descriptionItem.getPosition())
                                                .line(descriptionItem.getLine())
                                                .side(descriptionItem.getSide())
                                                .startLine(descriptionItem.getStartLine())
                                                .startSide(descriptionItem.getStartSide())
                                                .build());
                            }
                        }

                        // 파일이 없는 경우 바로 설명 생성 (body가 null이어도 허용)
                        return Mono.just(Description.builder()
                                .pullRequest(pullRequest)
                                .user(user)
                                .path(descriptionItem.getPath())
                                .body(descriptionItem.getBody())
                                .recordKey(null)
                                .position(descriptionItem.getPosition())
                                .line(descriptionItem.getLine())
                                .side(descriptionItem.getSide())
                                .startLine(descriptionItem.getStartLine())
                                .startSide(descriptionItem.getStartSide())
                                .build());
                    }, 5) // 최대 5개 동시 처리
                    .collectList()
                    .block(Duration.ofMinutes(5)); // 최대 10분 대기

            // DB 저장
            List<Description> savedDescriptions = descriptionRepository.saveAll(descriptions);
            log.info("Description 일괄 생성 완료 - 생성된 설명 수: {}", savedDescriptions.size());

            return savedDescriptions.stream()
                    .map(DescriptionResponse::from)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Description 일괄 생성 중 오류 발생: {}", e.getMessage());
            // 에러 시 업로드된 파일 정리
            if (!uploadedFileKeys.isEmpty()) {
                s3Service.cleanupUploadedFiles(uploadedFileKeys);
            }
            throw new RuntimeException("Description 일괄 생성에 실패했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<DescriptionResponse> getDescriptionsByPullRequestId(Long pullRequestId) {
        List<Description> descriptions = descriptionRepository.findByPullRequestId(pullRequestId);
        return descriptions.stream()
                .map(DescriptionResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DescriptionResponse getDescriptionById(Long descriptionId) {
        Description description = descriptionRepository.findById(descriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Description not found: " + descriptionId));
        return DescriptionResponse.from(description);
    }

    @Override
    @Transactional
    public DescriptionResponse updateDescription(Long descriptionId, DescriptionUpdateRequest request, Long userId, MultipartFile file) {
        log.info("Description 수정 시작 - ID: {}, User: {}", descriptionId, userId);

        Description description = descriptionRepository.findById(descriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Description not found: " + descriptionId));

        if (!description.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        String newBody = request.getBody();
        String newRecordKey = description.getRecordKey();

        if (file != null && !file.isEmpty()) {
            // 기존 파일 삭제
            if (description.getRecordKey() != null) {
                s3Service.deleteFile(description.getRecordKey());
            }

            // AI 처리와 S3 업로드를 병렬로 수행
            Mono<String> aiProcessing = aiClient.processAudioFile(file);
            Mono<String> s3Upload = Mono.fromCallable(() -> 
                s3Service.uploadFile(file, description.getPullRequest().getId())
            ).subscribeOn(Schedulers.boundedElastic());

            var result = Mono.zip(aiProcessing, s3Upload).block();
            newBody = result.getT1();
            newRecordKey = result.getT2();
        }

        description.updateBodyAndRecordKey(newBody, newRecordKey);
        Description savedDescription = descriptionRepository.save(description);

        log.info("Description 수정 완료 - ID: {}", savedDescription.getId());
        return DescriptionResponse.from(savedDescription);
    }

    @Override
    @Transactional
    public void deleteDescription(Long descriptionId, Long userId) {
        log.info("Description 삭제 시작 - ID: {}, User: {}", descriptionId, userId);

        Description description = descriptionRepository.findById(descriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Description not found: " + descriptionId));

        if (!description.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        // S3 파일 삭제
        if (description.getRecordKey() != null) {
            s3Service.deleteFile(description.getRecordKey());
        }

        descriptionRepository.delete(description);
        log.info("Description 삭제 완료 - ID: {}", descriptionId);
    }

}