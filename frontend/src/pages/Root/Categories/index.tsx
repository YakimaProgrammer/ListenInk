import { List, ListItemButton, ListItemText, Collapse } from "@mui/material";
import { connect, ConnectedProps } from "react-redux";
import { useNavigate, useParams } from "react-router";

import { Conditional } from "@/components/Conditional";
import { AppDispatch, RootState, setCategory } from "@/store";
import { ReshapedCategory } from "@/store/slices/categories";
import { urlFor } from "@/pages/urlfor";

const categoriesMapStateToProps = (state: RootState) => {
  const reason: string | undefined = state.categories.status === "failure" ? state.categories.message : undefined;
  // ReducedDoc is a placeholder type until I stablize the API.
  // It includes information I largely expect to be there in the final API version.
  const categories: ReshapedCategory[] | undefined = state.categories.status === "success" ? state.categories.categories : undefined;
  
  return {
    reason,
    categories,
    status: state.categories.status
  }
};
const categoriesConnector = connect(categoriesMapStateToProps);
type CategoriesPropsFromRedux = ConnectedProps<typeof categoriesConnector>;

function CategoriesComponent({ categories, status, reason }: CategoriesPropsFromRedux) {
  return (
    <Conditional status={status} reason={reason}>
      <List>
	{categories?.map(c => <ConnectedCategory key={c.id} c={c} />)}
      </List>
    </Conditional>
  );
}
export const Categories = categoriesConnector(CategoriesComponent);





interface CategoryOwnProps {
  c: ReshapedCategory;
}
const categoryMapStateToProps = (state: RootState, ownProps: CategoryOwnProps) => ({
  open: !!state.ui.openCategories[ownProps.c.id]
});
const categoryMapDispatchToProps = (dispatch: AppDispatch, ownProps: CategoryOwnProps) => ({
  setOpen: (open: boolean) => dispatch(setCategory({ open, id: ownProps.c.id }))
});
const categoryConnector = connect(categoryMapStateToProps, categoryMapDispatchToProps);
type CategoryPropsFromRedux = ConnectedProps<typeof categoryConnector>;
function CategoryComponent({ c, open, setOpen }: CategoryPropsFromRedux & CategoryOwnProps) {
  const { docId } = useParams();
  const navigate = useNavigate();
  
  const documents = c.documents.map(d => (
    <ListItemButton key={d.id} selected={ d.id === docId } onClick={() => navigate(urlFor("docs", d.id))}>
      <ListItemText primary={d.name} style={{ textOverflow: "ellipsis" }} />
    </ListItemButton>
  ));

  const forceOpen = c.documents.some(d => d.id === docId);
  
  return (
    <>
      <ListItemButton onClick={() => { if (!forceOpen) { setOpen(!open) } } }>
        <ListItemText style={{ color: c.color }}>
	  {c.name}
   	</ListItemText>
      </ListItemButton>
      <Collapse in={open || forceOpen}>
	{/* Padding left of 4 for nice indentation */}
	<List component="div" disablePadding sx={{ pl: 4 }}>
	  { documents }
	</List>
      </Collapse>
    </>
  );
}
const ConnectedCategory = categoryConnector(CategoryComponent);
