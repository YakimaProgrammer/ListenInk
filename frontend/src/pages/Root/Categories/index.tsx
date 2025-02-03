import { List, ListItemButton, ListItemText } from "@mui/material";
import { connect, ConnectedProps } from "react-redux";
import { Conditional } from "@/components/Conditional";
import { Category } from "@/types";
import { RootState } from "@/store";

const mapStateToProps = (state: RootState) => {
  const reason: string | undefined = state.categories.status === "failure" ? state.categories.message : undefined;
  const categories: Category[] | undefined = state.categories.status === "success" ? state.categories.categories : undefined;
  
  return {
    reason,
    categories,
    status: state.categories.status
  }
};

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function CategoriesComponent({ categories, status, reason }: PropsFromRedux) {
  return (
    <Conditional status={status} reason={reason}>
      <List>
	{categories?.map(c => (
          <ListItemButton key={c.id}>
            <ListItemText style={{ color: c.color }}>
	      {c.name}
	    </ListItemText>
          </ListItemButton>
	))}
      </List>
    </Conditional>
  );
}

export const Categories = connector(CategoriesComponent);
