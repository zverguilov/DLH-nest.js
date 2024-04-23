import { Expose } from "class-transformer";
import { ReviewAnswerDTO } from "../answer/review-answer.dto";
import { ReviewCommentDTO } from "../comment/review-comment.dto";

export class ReviewFlaggedQuestionDTO {
    @Expose()
    public id: string;

    @Expose()
    public body: string;

    @Expose()
    public category: string;

    @Expose()
    public is_flagged: boolean;
}