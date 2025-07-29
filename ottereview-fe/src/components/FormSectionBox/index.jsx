const FormSectionBox = ({ title, children }) => (
  <div className="p-4 border">
    {title && <h2 className="text-xl font-semi-bold mb-4">{title}</h2>}
    {children}
  </div>
)

export default FormSectionBox
