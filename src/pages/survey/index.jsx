import { useSearchParams } from "react-router-dom";
import SurveyForm from "@/pages/editor/form-design/surveyForm";

function Survey() {
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('id')
  const isPreview = searchParams.get('preview')
  return (
    <div>
      <SurveyForm surveyId={surveyId} type={isPreview ? 'preview' : 'answer'}/>
    </div>
  );
}

export default Survey;