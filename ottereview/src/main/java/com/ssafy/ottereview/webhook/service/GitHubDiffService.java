package com.ssafy.ottereview.webhook.service;

import com.ssafy.ottereview.webhook.dto.DiffHunk;
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
public class GitHubDiffService {

    public List<DiffHunk> parseDiffHunks(String patch) {
        if (patch == null || patch.isEmpty()) {
            return Collections.emptyList();
        }

        List<DiffHunk> hunks = new ArrayList<>();
        String[] lines = patch.split("\n");

        DiffHunk currentHunk = null;

        for (String line : lines) {
            if (line.startsWith("@@")) {
                // 새로운 hunk 시작
                if (currentHunk != null) {
                    hunks.add(currentHunk);
                }
                currentHunk = parseHunkHeader(line);
            } else if (currentHunk != null) {
                // hunk 내용 추가
                currentHunk.addLine(line);
            }
        }

        if (currentHunk != null) {
            hunks.add(currentHunk);
        }

        return hunks;
    }

    private DiffHunk parseHunkHeader(String header) {
        // @@ -1,3 +1,4 @@ 형식 파싱
        Pattern pattern = Pattern.compile("@@\\s+-([0-9]+),?([0-9]*)\\s+\\+([0-9]+),?([0-9]*)\\s+@@(.*)");
        Matcher matcher = pattern.matcher(header);

        if (matcher.find()) {
            int oldStart = Integer.parseInt(matcher.group(1));
            int oldLines = matcher.group(2).isEmpty() ? 1 : Integer.parseInt(matcher.group(2));
            int newStart = Integer.parseInt(matcher.group(3));
            int newLines = matcher.group(4).isEmpty() ? 1 : Integer.parseInt(matcher.group(4));
            String context = matcher.group(5).trim();

            return DiffHunk.builder()
                    .oldStart(oldStart)
                    .oldLines(oldLines)
                    .newStart(newStart)
                    .newLines(newLines)
                    .context(context)
                    .lines(new ArrayList<>())
                    .build();
        }

        return DiffHunk.builder().lines(new ArrayList<>()).build();
    }
}
