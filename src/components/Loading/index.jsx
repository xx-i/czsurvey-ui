import 'spinkit/spinkit.min.css'
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

const LoadingContext = createContext(null);

export const loadingNode = (
  <div className="sk-wave">
    <div className="sk-wave-rect"></div>
    <div className="sk-wave-rect"></div>
    <div className="sk-wave-rect"></div>
    <div className="sk-wave-rect"></div>
    <div className="sk-wave-rect"></div>
  </div>
);

function Loading() {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '0',
        width: '100vw',
        height: '100vh',
        background: '#fff',
        zIndex: 20000,
        display: 'flex',
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {loadingNode}
    </div>,
    document.body
  );
}

export function LoadingProvider({children}) {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={[loading, setLoading]}>
      {
        loading && <Loading/>
      }
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const [loading, setLoading] = useContext(LoadingContext);
  return {
    loading,
    setLoading: (loading) => {
      loading ? setLoading(true) : setTimeout(() => setLoading(false), 600);
    }
  };
}