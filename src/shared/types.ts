export type Emotion =
  | 'Admiration'
  | 'Adoration'
  | 'Aesthetic Appreciation'
  | 'Amusement'
  | 'Anger'
  | 'Anxiety'
  | 'Awe'
  | 'Awkwardness'
  | 'Boredom'
  | 'Calmness'
  | 'Concentration'
  | 'Confusion'
  | 'Contemplation'
  | 'Contempt'
  | 'Contentment'
  | 'Craving'
  | 'Desire'
  | 'Determination'
  | 'Disappointment'
  | 'Disgust'
  | 'Distress'
  | 'Doubt'
  | 'Ecstasy'
  | 'Embarrassment'
  | 'Empathic Pain'
  | 'Entrancement'
  | 'Envy'
  | 'Excitement'
  | 'Fear'
  | 'Guilt'
  | 'Horror'
  | 'Interest'
  | 'Joy'
  | 'Love'
  | 'Nostalgia'
  | 'Pain'
  | 'Pride'
  | 'Realization'
  | 'Relief'
  | 'Romance'
  | 'Sadness'
  | 'Satisfaction'
  | 'Shame'
  | 'Surprise (negative)'
  | 'Surprise (positive)'
  | 'Sympathy'
  | 'Tiredness'
  | 'Triumph';

export type PredictionTime = {
  begin: number;
  end: number;
};

export type BoundingBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type EmotionScore = {
  name: Emotion;
  score: number;
};

export type Prediction = {
  frame: number;
  time: PredictionTime;
  bbox: BoundingBox;
  prob: number;
  face_id: string;
  emotions: EmotionScore[];
};

export type MessageResponseBody = {
  payload_id: string;
  face: {
    predictions: Prediction[];
  };
};
