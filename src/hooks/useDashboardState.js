import { useReducer } from "react";
import { DEFAULT_SELECTED_CATEGORIES, DEFAULT_UNIT_SCALE } from "../constants/sampleData";

const initialState = {
  priceCSV: "",
  flowCSV: "",
  anchorIndex: 0,
  days: 60,
  useSample: false,
  unitScale: DEFAULT_UNIT_SCALE,
  selectedCats: DEFAULT_SELECTED_CATEGORIES,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_PRICE_CSV":
      return { ...state, priceCSV: action.payload };
    case "SET_FLOW_CSV":
      return { ...state, flowCSV: action.payload };
    case "SET_ANCHOR_INDEX":
      return { ...state, anchorIndex: action.payload };
    case "SET_DAYS":
      return { ...state, days: action.payload };
    case "SET_USE_SAMPLE":
      return { ...state, useSample: action.payload };
    case "SET_UNIT_SCALE":
      return { ...state, unitScale: action.payload };
    case "TOGGLE_CATEGORY":
      return state.selectedCats.includes(action.payload)
        ? { ...state, selectedCats: state.selectedCats.filter((k) => k !== action.payload) }
        : { ...state, selectedCats: [...state.selectedCats, action.payload] };
    default:
      return state;
  }
}

export function useDashboardState() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return { state, dispatch };
}
