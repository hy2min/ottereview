package com.ssafy.ottereview.priority.controller;

import com.ssafy.ottereview.priority.dto.CreatePriorityRequest;
import com.ssafy.ottereview.priority.service.PriorityService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/pull-requests/{pr-id}/priorities")
public class PriorityController {

    private final PriorityService priorityService;

    /**
     * pullRequestId를 가지고 해당하는 priorityList를 반환해준다.
     * @param pullRequestId
     * @return List<Priority>
     */
    @GetMapping()
    public ResponseEntity<?> getPriorityByPriorityId(@PathVariable (name = "pr-id")Long pullRequestId){
        return ResponseEntity.ok(priorityService.getPriorityListByPullRequest(pullRequestId));
    }

    @PostMapping()
    public void createPriority(@RequestBody List<CreatePriorityRequest> createPriorityRequestList){
        priorityService.createPriorityList(createPriorityRequestList);
    }
}
