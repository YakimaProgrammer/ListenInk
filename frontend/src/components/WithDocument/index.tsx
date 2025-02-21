import { RootState } from "@/store";
import { Document } from "@/types";
import { ComponentType } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

export function useDocument(): Document | undefined {
  const { docId } = useParams();
  const doc = useSelector((state: RootState) => {
    if (state.categories.status === "success") {
      if (docId !== undefined) {
	return state.categories.documents[docId];
      }
    } 
    return undefined;
  });
  return doc;
}

interface InjectedProps {
  docId?: string;
  doc?: Document;
}

export function withDocument<P extends InjectedProps>(
  WrappedComponent: ComponentType<P>
) {
  return (props: Omit<P, keyof InjectedProps>) => {
    const { docId } = useParams();
    const doc = useDocument();
    return <WrappedComponent {...(props as P)} docId={docId} doc={doc} />;
  };
}
