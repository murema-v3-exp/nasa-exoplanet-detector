import numpy as np

def ensemble_predict(cnn_pred, ml_pred, cnn_weight=0.6):
    # cnn_pred and ml_pred are probability arrays
    final_pred = cnn_weight * cnn_pred + (1 - cnn_weight) * ml_pred
    return np.argmax(final_pred, axis=1)
