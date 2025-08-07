package com.ssafy.ottereview.priority.service;

import com.ssafy.ottereview.priority.dto.CreatePriorityRequest;
import com.ssafy.ottereview.priority.dto.PriorityResponse;
import com.ssafy.ottereview.priority.entity.Priority;
import com.ssafy.ottereview.priority.repository.PriorityRepository;
import com.ssafy.ottereview.pullrequest.entity.PullRequest;
import com.ssafy.ottereview.pullrequest.repository.PullRequestRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PriorityServiceImpl implements PriorityService {

    private final PriorityRepository priorityRepository;
    private final PullRequestRepository pullRequestRepository;

    @Override
    public List<PriorityResponse> getPriorityListByPullRequest(Long pullRequestId){
        PullRequest pullRequest = pullRequestRepository.getReferenceById(pullRequestId);
        List<Priority> priorities = priorityRepository.findAllByPullRequest(pullRequest);
        return priorities.stream().map(PriorityResponse::fromEntity).toList();
    }

    @Override
    public void createPriorityList(List<CreatePriorityRequest> createPriorityRequestList){
        priorityRepository.saveAll(createPriorityRequestList.stream().map(CreatePriorityRequest::to).toList());
    }
}
