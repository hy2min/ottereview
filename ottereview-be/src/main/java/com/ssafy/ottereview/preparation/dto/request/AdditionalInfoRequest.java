package com.ssafy.ottereview.preparation.dto.request;

import com.ssafy.ottereview.preparation.dto.DescriptionInfo;
import com.ssafy.ottereview.preparation.dto.PriorityInfo;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdditionalInfoRequest {
    
    private String source;
    private String target;
    private String title;
    private String body;
    private String summary;
    private List<Long> reviewers;
    private List<DescriptionInfo> description;
    private List<PriorityInfo> priorities;
}
