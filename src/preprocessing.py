import pandas as pd
import numpy as np
from pandas.errors import ParserError


def load_csv(file_path):
    """Robust CSV loader.

    Accepts a path or a file-like object (Streamlit uploader). Handles files
    that have leading comment lines starting with '#', like the Kepler
    catalog CSVs.
    """
    try:
        # Common case: skip leading comment lines starting with '#'
        return pd.read_csv(file_path, comment='#', low_memory=False)
    except ParserError:
        # Fallback: try the Python engine which is more forgiving
        try:
            return pd.read_csv(file_path, engine='python')
        except Exception:
            # Last resort: raise original parser error to caller
            raise

def clean_data(df):
    # Conservative cleaning: drop rows where all values are NA but leave
    # rows with some missing fields (catalogs often have partial data).
    return df.dropna(how='all')

def normalize_flux(df, flux_col='flux'):
    df[flux_col] = (df[flux_col] - df[flux_col].min()) / (df[flux_col].max() - df[flux_col].min())
    return df
