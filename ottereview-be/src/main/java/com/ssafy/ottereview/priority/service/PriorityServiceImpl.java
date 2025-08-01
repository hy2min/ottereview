package com.ssafy.ottereview.priority.service;

import com.ssafy.ottereview.priority.dto.CreatePriorityRequest;
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
    public List<Priority> getPriorityListByPullRequest(Long pullRequestId){
        PullRequest pullRequest = pullRequestRepository.getReferenceById(pullRequestId);
        return priorityRepository.findAllByPullRequest(pullRequest);
    }

    @Override
    public void createPriorityList(List<CreatePriorityRequest> createPriorityRequestList){
        priorityRepository.saveAll(createPriorityRequestList.stream().map(CreatePriorityRequest::to).toList());
    }
}
