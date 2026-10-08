interface ModulePlaceholderProps {
  title: string;
  description: string;
}

const ModulePlaceholder = ({ title, description }: ModulePlaceholderProps) => {
  return (
    <section className="module-placeholder">
      <div className="module-placeholder-eyebrow">FITFLOW MODULE</div>

      <h1>{title}</h1>

      <p>{description}</p>

      <span className="module-placeholder-status">
        Coming in the next development point
      </span>
    </section>
  );
};

export default ModulePlaceholder;
