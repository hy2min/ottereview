package com.ssafy.ottereview.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SliceResponse<T>{
    private List<T> items;
    private String nextCursor; // null if no more
    private boolean hasMore;
}
