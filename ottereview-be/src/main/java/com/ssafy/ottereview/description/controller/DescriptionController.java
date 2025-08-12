package com.ssafy.ottereview.description.controller;

import com.ssafy.ottereview.common.annotation.MvcController;
import com.ssafy.ottereview.description.dto.DescriptionCreateRequest;
import com.ssafy.ottereview.description.dto.DescriptionResponse;
import com.ssafy.ottereview.description.dto.DescriptionUpdateRequest;
import com.ssafy.ottereview.description.service.DescriptionService;
import com.ssafy.ottereview.user.entity.CustomUserDetail;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pull-requests/{pull-request-id}/descriptions")
@RequiredArgsConstructor
@Slf4j
@MvcController
public class DescriptionController {

    private final DescriptionService descriptionService;

    @GetMapping("")
    public ResponseEntity<List<DescriptionResponse>> getDescriptionsByPullRequest(
            @PathVariable("pull-request-id") Long pullRequestId) {

        List<DescriptionResponse> descriptions = descriptionService.getDescriptionsByPullRequestId(pullRequestId);
        return ResponseEntity.ok(descriptions);
    }

    @GetMapping("/{description-id}")
    public ResponseEntity<DescriptionResponse> getDescription(
            @PathVariable("description-id") Long descriptionId) {

        DescriptionResponse response = descriptionService.getDescriptionById(descriptionId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{description-id}")
    public ResponseEntity<DescriptionResponse> updateDescription(
            @PathVariable("description-id") Long descriptionId,
            @RequestPart DescriptionUpdateRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        DescriptionResponse response = descriptionService.updateDescription(
                descriptionId, request, userDetail.getUser().getId(), file);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{description-id}")
    public ResponseEntity<String> deleteDescription(
            @PathVariable("description-id") Long descriptionId,
            @AuthenticationPrincipal CustomUserDetail userDetail) {

        descriptionService.deleteDescription(descriptionId, userDetail.getUser().getId());
        return ResponseEntity.ok("Description이 성공적으로 삭제되었습니다.");
    }

}
