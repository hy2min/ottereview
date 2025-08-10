package com.ssafy.ottereview.pullrequest.util;

import com.ssafy.ottereview.preparation.dto.DiffHunk;
import com.ssafy.ottereview.preparation.dto.DiffLine;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiffUtil {

    public List<DiffHunk> parseDiffHunks(String patch) {
        if (patch == null || patch.isEmpty()) {
            return Collections.emptyList();
        }

        List<DiffHunk> hunks = new ArrayList<>();
        String[] lines = patch.split("\n");

        DiffHunk currentHunk = null;
        int currentOldLine = 0;
        int currentNewLine = 0;
        int position = 0;

        for (String line : lines) {
            if (line.startsWith("@@")) {
                // 이전 hunk 저장
                if (currentHunk != null) {
                    hunks.add(currentHunk);
                }

                // 새로운 hunk 시작
                currentHunk = parseHunkHeader(line);
                currentOldLine = currentHunk.getOldStart();
                currentNewLine = currentHunk.getNewStart();
                position = 0;
            } else if (currentHunk != null) {
                // 라인 내용 파싱
                DiffLine diffLine = parseLine(line, currentOldLine, currentNewLine, position);
                currentHunk.addLine(diffLine);

                // 라인 번호 업데이트
                if (diffLine.getType()
                        .equals("context") || diffLine.getType()
                        .equals("deletion")) {
                    currentOldLine++;
                }
                if (diffLine.getType()
                        .equals("context") || diffLine.getType()
                        .equals("addition")) {
                    currentNewLine++;
                }
                position++;
            }
        }

        // 마지막 hunk 저장
        if (currentHunk != null) {
            hunks.add(currentHunk);
        }

        return hunks;
    }

    private DiffLine parseLine(String line, int currentOldLine, int currentNewLine, int position) {
        if (line.isEmpty()) {
            // 빈 라인 처리
            return DiffLine.builder()
                    .oldLine(currentOldLine)
                    .newLine(currentNewLine)
                    .type("context")
                    .content("")
                    .position(position)
                    .build();
        }

        char prefix = line.charAt(0);
        String content = line.length() > 1 ? line.substring(1) : "";

        switch (prefix) {
            case ' ': // 변경 없는 라인 (context)
                return DiffLine.builder()
                        .oldLine(currentOldLine)
                        .newLine(currentNewLine)
                        .type("context")
                        .content(content)
                        .position(position)
                        .build();

            case '-': // 삭제된 라인
                return DiffLine.builder()
                        .oldLine(currentOldLine)
                        .newLine(null)
                        .type("deletion")
                        .content(content)
                        .position(position)
                        .build();

            case '+': // 추가된 라인
                return DiffLine.builder()
                        .oldLine(null)
                        .newLine(currentNewLine)
                        .type("addition")
                        .content(content)
                        .position(position)
                        .build();

            default: // 알 수 없는 prefix는 context로 처리
                return DiffLine.builder()
                        .oldLine(currentOldLine)
                        .newLine(currentNewLine)
                        .type("context")
                        .content(line)
                        .position(position)
                        .build();
        }
    }

    private DiffHunk parseHunkHeader(String header) {
        // @@ -1,3 +1,4 @@ 형식 파싱
        Pattern pattern = Pattern.compile("@@\\s+-([0-9]+),?([0-9]*)\\s+\\+([0-9]+),?([0-9]*)\\s+@@(.*)");
        Matcher matcher = pattern.matcher(header);

        if (matcher.find()) {
            int oldStart = Integer.parseInt(matcher.group(1));
            int oldLines = matcher.group(2)
                    .isEmpty() ? 1 : Integer.parseInt(matcher.group(2));
            int newStart = Integer.parseInt(matcher.group(3));
            int newLines = matcher.group(4)
                    .isEmpty() ? 1 : Integer.parseInt(matcher.group(4));
            String context = matcher.group(5)
                    .trim();

            return DiffHunk.builder()
                    .oldStart(oldStart)
                    .oldLines(oldLines)
                    .newStart(newStart)
                    .newLines(newLines)
                    .context(context)
                    .lines(new ArrayList<>())
                    .build();
        }

        return DiffHunk.builder()
                .lines(new ArrayList<>())
                .build();
    }

    // 편의 메서드: 모든 라인을 평탄화해서 반환
    public List<DiffLine> getAllLines(String patch) {
        List<DiffHunk> hunks = parseDiffHunks(patch);
        List<DiffLine> allLines = new ArrayList<>();

        for (DiffHunk hunk : hunks) {
            allLines.addAll(hunk.getLines());
        }

        return allLines;
    }
}
