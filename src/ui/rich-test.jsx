import {Admin, Resource, List, TextField, TextInput, Datagrid, SimpleForm, Edit, useInput} from 'react-admin';
import {FrugalTextInput} from "./FrugalTextInput";
import fakeDataProvider from 'ra-data-fakerest';

const dataProvider = fakeDataProvider({
    posts: [
        { id: 0, title: 'Hello, world!', richcontent: 'testing', frugalcontent: 'this is for poor people' },
        { id: 1, title: 'FooBar', richcontent: 'testing again', frugalcontent: 'this is for poor people' },
    ]
})

function PostsList() {
    return (
        <List hasCreate={true} exporter={false}>
            <Datagrid rowClick="edit" size="medium">
                <TextField source="title"/>
            </Datagrid>
        </List>
    );
}

function MyToolbar() {
    return (
        <div>hello...</div>
    )
}

function PostsEdit() {
    //console.log("render...");

    return (
        <Edit mutationMode="pessimistic" key="edit">
            <SimpleForm key="simple">
                <TextInput source="title"/>
                <FrugalTextInput source="frugalcontent" fullWidth={true} />
                <TextInput source="title"/>
            </SimpleForm>
        </Edit>
    );
}

export function App() {
    return (
        <Admin dataProvider={dataProvider}>
            <Resource name="posts" list={PostsList} edit={PostsEdit}/>
        </Admin>
    );
}
