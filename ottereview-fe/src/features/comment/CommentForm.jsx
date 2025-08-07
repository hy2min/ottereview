import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'

const CommentForm = ({ value, onChange, onSubmit, disabled = false }) => {
  return (
    <Box shadow>
      <InputBox
        className="h-20"
        as="textarea"
        label="댓글"
        value={value}
        onChange={onChange}
        placeholder="댓글을 입력하세요..."
        disabled={disabled}
      />
      <div className="flex justify-end mt-1">
        <Button variant="primary" onClick={onSubmit} disabled={disabled}>
          댓글 작성
        </Button>
      </div>
    </Box>
  )
}

export default CommentForm
