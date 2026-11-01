export default function VisuallyHidden({ children, as: Tag = 'span' }) {
  return <Tag className="sr-only">{children}</Tag>
}
