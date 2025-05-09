import {Admin, Layout, Menu, Resource, MenuItemLink, useResourceContext} from 'react-admin';
import {makeNameFromSymbol, splitPath} from "../utils/js-util.js";
import {useLocation} from "react-router";
import ViewListIcon from '@mui/icons-material/esm/ViewList';

function CollectionIcon({collection}) {
    let icon=(collection.icon||"view_list");

    return (
        <span class="material-icons">{icon}</span>
    );
}

function CollectionMenuItem({conf, collection, ...props}) {
    return (
        <Menu.Item 
                to={collection.getPath()} 
                primaryText={makeNameFromSymbol(collection.id)} 
                leftIcon={<CollectionIcon collection={collection}/>}
                {...props}/>
    );
}

function CategoryMenuItems({conf, category}) {
    let currentResourceId=splitPath(useLocation().pathname)[0];
    let currentCategoryId;

    if (currentResourceId && conf.collections[currentResourceId])
        currentCategoryId=conf.collections[currentResourceId].category;

    let collections=conf.getVisibleCollectionsByCategory(category);
    if (!collections.length)
        return [];

    let sx;
    if (category==currentCategoryId)
        sx={color: "#000000"};

    let menuItems=[];
    menuItems.push(
        <Menu.Item 
                to={collections[0].getPath()}
                primaryText={makeNameFromSymbol(category)}
                leftIcon={<CollectionIcon collection={collections[0]}/>}
                sx={sx}/>
    );

    if (category==currentCategoryId) {
        for (let collection of conf.getVisibleCollectionsByCategory(category))
            menuItems.push(
                <CollectionMenuItem
                        conf={conf} 
                        collection={collection}
                        dense
                        sx={{marginLeft: "1rem"}}/>
            );
    }

    return <>{menuItems}</>;
}

export default function QuickminLayout({conf, ...props}) {
    let menuItems=[];
    menuItems.push(<Menu.DashboardItem/>);

    let currentResourceId=splitPath(useLocation().pathname)[0];

    let renderedCategories=[];
    for (let collection of conf.getVisibleCollections()) {
        if (collection.category) {
            if (!renderedCategories.includes(collection.category)
                    && collection.category!="hidden") {
                renderedCategories.push(collection.category);
                menuItems.push(
                    <CategoryMenuItems
                            conf={conf}
                            category={collection.category}/>
                );
            }
        }

        else {
            menuItems.push(
                <CollectionMenuItem
                        conf={conf}
                        collection={collection}/>
            );

        }
    }

    function QuickminMenu() {
        return (
            <Menu>
                {menuItems}
            </Menu>    
        );
    }

    return (
        <Layout {...props} menu={QuickminMenu}/>
    )
}
