import { AppDispatch, RootState, setQuery, setSearchDialog } from "@/store";
import { Dialog, DialogContent, IconButton, InputAdornment, List, ListItemButton, ListItemIcon, TextField } from "@mui/material";
import { connect, ConnectedProps } from "react-redux";
import { useNavigate } from "react-router";
import { JSX } from "react";
import { Search, Close, Description } from "@mui/icons-material";
import { urlFor } from "@/pages/urlfor";
import { EnhancedDocument } from "@/store/slices/categories";
import { Document } from "@/types";

import style from "./index.module.scss";

const mapStateToProps = (state: RootState) => ({
  query: state.ui.searchQuery,
  open: state.ui.searchDialogOpen,
  docs: state.categories.status === "success" ? Object.values(state.categories.documents).filter((d): d is EnhancedDocument => d !== undefined) : []
});
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  close: () => dispatch(setSearchDialog(false)),
  setQuery: (query: string) => dispatch(setQuery(query))
});
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;


const NUM_RESULTS = 10;
function SearchDialogComponent({ query, open, close, setQuery, docs }: PropsFromRedux) {
  let navigate = useNavigate();
  
  // [TODO] This is proof-of-concept searching. I recommend fuse.js for fuzzy + full text search
  const hits = docs.filter(d => d.name.toLowerCase().includes(query.toLowerCase())).slice(0, NUM_RESULTS);

  // This is kind of evil. Normally, I'd `.map()` from hits to results, but I want to have precisely `NUM_RESULTS` results 
  const results: JSX.Element[] = [];
  for (let i = 0; i < NUM_RESULTS; i++) {
    let d: Document | undefined = hits[i];
    results.push(
      <ListItemButton
	key={i}
	onClick={() => {if (d !== undefined) { navigate(urlFor("docs", d.id)); close() }}}
	className={d === undefined ? style.hidden : ""}
      >
	<ListItemIcon>
	  <Description />
	</ListItemIcon>

	{d?.name}
      </ListItemButton>
    )
  }
  
  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth>
      <DialogContent dividers>
	<TextField
          variant="standard"
          placeholder="Search documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
	  fullWidth
          slotProps={{
            input: {
	      startAdornment: (
		<InputAdornment position="start">
		  <Search />
	        </InputAdornment>
              ),
	      endAdornment: (
		<InputAdornment position="end">
		  <IconButton onClick={query === "" ? close : () => setQuery("")} size="small">
                    <Close />
		  </IconButton>
	      </InputAdornment>
              ),
	    }
          }}
	/>
	<List>
	  { results }
	</List>
      </DialogContent>
    </Dialog>
  );
}

export const SearchDialog = connector(SearchDialogComponent);
