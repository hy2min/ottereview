const FormField = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block font-medium">{label}</label>
    {children}
  </div>
)

export default FormField
