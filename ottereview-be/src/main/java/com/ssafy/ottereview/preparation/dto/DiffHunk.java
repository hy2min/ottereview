package com.ssafy.ottereview.preparation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DiffHunk {
    private int oldStart;
    private int oldLines;
    private int newStart;
    private int newLines;
    private String context;
    private List<DiffLine> lines;  // String에서 DiffLine으로 변경

    public void addLine(DiffLine line) {
        lines.add(line);
    }
}
