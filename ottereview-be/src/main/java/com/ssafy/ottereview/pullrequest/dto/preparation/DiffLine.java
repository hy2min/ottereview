package com.ssafy.ottereview.pullrequest.dto.preparation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DiffLine {

    private Integer oldLine;     // 원본 파일의 라인 번호 (삭제된 라인이 아니면 null)
    private Integer newLine;     // 새 파일의 라인 번호 (추가된 라인이 아니면 null)
    private String type;         // "context", "addition", "deletion"
    private String content;      // 실제 라인 내용
    private Integer position;    // diff에서의 위치 (선택사항)
}
