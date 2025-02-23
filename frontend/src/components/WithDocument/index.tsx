import { RootState } from "@/store";
import { Document } from "@/types";
import { ComponentType } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

/** A hook that provides a `Document` if a valid document id is provided in the url parameters */
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

export type InjectedProps = {
  docId: string;
  doc: Document;
};

/** An HOC that passes a `Document` and `Document` id to a wrapped component, rendering null if there is no `Document` for the current URL */
export function withDocument<P extends InjectedProps>(
  WrappedComponent: ComponentType<P>
) {
  return (props: Omit<P, keyof InjectedProps>) => {
    const { docId } = useParams();
    const doc = useDocument();
    if (docId === undefined || doc === undefined) {
      return null;
    }

    const injectedProps: P = {
      ...props,
      docId,
      doc
    } as P; // Omit + the omitted props = the original type, but the typechecker can't verify that 
    return <WrappedComponent {...injectedProps} />;
  };
}
