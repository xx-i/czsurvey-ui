import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Indicator({id, type = 'indicator', className, style = {}, children}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id, data: {type}});

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{...style, transform: CSS.Transform.toString(transform), transition}}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export default Indicator;