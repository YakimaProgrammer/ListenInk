import { ReactNode, useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchProfile, fetchDocuments, AppDispatch } from "@/store";
import { useNavigate } from "react-router";
import { urlFor } from "@/pages/urlfor";

interface PageInitializerProps {
  children: ReactNode;
}

export function PageInitializer({ children }: PageInitializerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchProfile()).unwrap();
        await dispatch(fetchDocuments()).unwrap();
      } catch (err) {
	navigate(urlFor("login"));
        console.error("Error during page load:", err);
      }
    };

    loadData();
  }, [dispatch]);

  return <>{ children }</>;
};
