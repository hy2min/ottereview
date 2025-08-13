    package com.ssafy.ottereview.repo.exception;

    import com.ssafy.ottereview.common.exception.ErrorCode;
    import lombok.Getter;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.HttpStatus;

    @Getter
    @RequiredArgsConstructor
    public enum RepoErrorCode implements ErrorCode {

        REPO_NOT_FOUND("REPO001", "Repository를 찾을 수 없습니다", 404),
        REPO_ALREADY_EXISTS("REPO002", "이미 존재하는 Repository입니다", 409),
        REPO_NOT_AUTHORIZED("REPO003", "Repository에 대한 권한이 없습니다", 403),
        REPO_INVALID_STATE("REPO004", "Repository의 상태가 유효하지 않습니다", 400),
        REPO_SYNC_FAILED("REP0005","Repository를 깃허브에서 불러오는데 실패했습니다" , 403),
        INVALID_ACCOUNT_ID("REP0006","계정 ID가 유효하지 않습니다" , 400),
        DATABASE_ERROR("REP0007", "저장소 ID가 유효하지 않습니다", 400 ),
        REPO_CREATE_FAILED("REP0008", "저장소 생성에 실패했습니다", 500),
        INVALID_USER("REP0009", "사용자 정보가 유효하지 않습니다", 400),
        REPO_FETCH_FAILED("REP0010", "저장소 조회에 실패했습니다", 500),
        INVALID_SYNC_PARAMETERS("REP0011", "존재하지 않는 파라미터입니다" ,404 ),
        GITHUB_API_ERROR("REP0012", "GitHub API 호출 중 오류가 발생했습니다", 502),
        REPO_PROCESSING_ERROR("REP0013", "저장소 처리 중 오류가 발생했습니다", 500),
        REPO_BATCH_CREATE_FAILED("REP0023", "저장소 일괄 생성에 실패했습니다", 500),
        ACCOUNT_NOT_FOUND("REP0015", "계정을 찾을 수 없습니다", 404),
        INSTALLATION_ID_NOT_FOUND("REP0016", "설치 ID를 찾을 수 없습니다", 404),
        INVALID_REPO_ID("REP0017", "저장소 ID가 유효하지 않습니다", 400),
        INVALID_REQUEST("REP0018", "요청 데이터가 유효하지 않습니다", 400),
        INVALID_REPO_NAME("REP0019", "저장소 이름이 유효하지 않습니다", 400),
        INVALID_ACCOUNT("REP0020", "계정 정보가 유효하지 않습니다", 400),
        REPO_UPDATE_FAILED("REP0021", "저장소 업데이트에 실패했습니다", 500),
        REPO_DELETE_FAILED("REP0022", "저장소 삭제에 실패했습니다", 500),
        INVALID_DELETE_PARAMETERS("REP0024", "삭제 파라미터가 유효하지 않습니다", 400),
        REPO_BATCH_UPDATE_FAILED("REP0025", "저장소 일괄 업데이트에 실패했습니다", 500),
        REPO_BATCH_DELETE_FAILED("REP0026", "저장소 일괄 삭제에 실패했습니다", 500),
        USER_FETCH_FAILED("REP0027", "사용자 조회에 실패했습니다", 500);


        private final String code;
        private final String message;
        private final int httpStatus;
    }
