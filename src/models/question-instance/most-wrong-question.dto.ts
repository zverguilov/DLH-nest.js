export class MostWrongQuestionDTO {
  id: string;
  body: string;
  category: string;

  wrongCount: number;
  totalCount: number;

  errorRate: number;      // wrongCount / totalCount
  bayesianError: number;  // Bayesian score
}