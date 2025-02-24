import { RootState } from "@/store";
import { ReducedDoc } from "@/store/slices/categories";
import { ComponentType } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

export function useDocument(): ReducedDoc | null {
  const { docId } = useParams();
  const doc = useSelector((state: RootState) => {
    if (state.categories.status === "success") {
      for (let category of state.categories.categories) {
        for (let d of category.documents) {
          if (d.id === docId) {
            return d;
          }
        }
      }
    }
    return null;
  });
  return doc;
}

interface InjectedProps {
  docId: string | undefined;
  doc: Document | null;
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
