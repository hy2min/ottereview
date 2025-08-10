import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'

const CommentForm = ({ value, onChange, onSubmit, disabled = false }) => {
  return (
    <Box shadow>
      <InputBox
        className="h-30"
        as="textarea"
        label="리뷰"
        value={value}
        onChange={onChange}
        placeholder="댓글을 입력하세요..."
        disabled={disabled}
      />
      <div className="flex justify-end">
        <Button size='sm' variant="secondary" onClick={onSubmit} disabled={disabled}>
          제출
        </Button>
      </div>
    </Box>
  )
}

export default CommentForm
