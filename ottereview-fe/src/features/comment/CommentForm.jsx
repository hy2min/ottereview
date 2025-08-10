import Box from '@/components/Box'
import Button from '@/components/Button'
import InputBox from '@/components/InputBox'

const CommentForm = ({ value, onChange, onSubmit, onCancel, disabled = false }) => {
  return (
    <Box shadow>
      <InputBox
        className="h-30"
        as="textarea"
        label="리뷰"
        value={value}
        onChange={onChange}
        placeholder="리뷰를 입력하세요..."
        disabled={disabled}
      />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={disabled}>
          취소
        </Button>
        <Button size="sm" variant="secondary" onClick={onSubmit} disabled={disabled}>
          제출
        </Button>
      </div>
    </Box>
  )
}

export default CommentForm
