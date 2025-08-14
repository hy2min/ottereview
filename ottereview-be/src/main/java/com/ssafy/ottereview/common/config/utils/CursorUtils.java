package com.ssafy.ottereview.common.config.utils;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

public class CursorUtils {
    public static String encode(Instant updatedAt, long id) {
        var raw = updatedAt + "|" + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
    public static record Cursor(Instant updatedAt, long id) {}
    public static Cursor decode(String cursor) {
        var raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
        var parts = raw.split("\\|");
        return new Cursor(Instant.ofEpochMilli(Long.parseLong(parts[0])), Long.parseLong(parts[1]));
    }
}
