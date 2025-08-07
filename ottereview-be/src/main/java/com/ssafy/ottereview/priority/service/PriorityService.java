package com.ssafy.ottereview.priority.service;

import com.ssafy.ottereview.priority.dto.CreatePriorityRequest;
import com.ssafy.ottereview.priority.dto.PriorityResponse;
import com.ssafy.ottereview.priority.entity.Priority;
import java.util.List;

public interface PriorityService {

    public  List<PriorityResponse> getPriorityListByPullRequest(Long pullRequestId);

    public void createPriorityList(List<CreatePriorityRequest> createPriorityRequestList);
}
