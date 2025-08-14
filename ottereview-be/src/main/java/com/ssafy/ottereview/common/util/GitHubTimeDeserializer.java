package com.ssafy.ottereview.common.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

public class GitHubTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String dateString = parser.getText();
        if (dateString != null && !dateString.isEmpty()) {
            try {
                // GitHub의 ISO 8601 형식 (UTC)을 파싱하여 KST로 변환
                ZonedDateTime utcDateTime = ZonedDateTime.parse(dateString);
                return utcDateTime.withZoneSameInstant(ZoneId.of("Asia/Seoul")).toLocalDateTime();
            } catch (Exception e) {
                // 파싱 실패시 현재 시간 반환
                return LocalDateTime.now(ZoneId.of("Asia/Seoul"));
            }
        }
        return null;
    }
}