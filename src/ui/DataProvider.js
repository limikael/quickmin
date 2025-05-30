import simpleRestProvider from 'ra-data-simple-rest';
import {fetchUtils} from 'ra-core';
import FIELD_TYPES from "./field-types.jsx";

export default class DataProvider {
	constructor(conf) {
        this.conf=conf;
        this.apiUrl=conf.apiUrl;
        this.httpClient=conf.httpClient;

        if (!this.httpClient)
            this.httpClient=fetchUtils.fetchJson;

        this.collections=conf.collections;
		this.simpleRestProvider=simpleRestProvider(this.apiUrl,this.httpClient);
	}

    processRead(resource, data) {
        //console.log("process read ",resource,data);

        for (let fid in this.collections[resource].fields) {
            if (data.hasOwnProperty(fid)) {
                let type=this.collections[resource].fields[fid].type;
                let processor=FIELD_TYPES[type].readProcessor;
                if (processor)
                    data[fid]=processor(data[fid],this.conf);
            }
        }

        return data;
    }

    createFormData=(resource, data, fieldNames)=>{
        console.log(data);

        const formData=new FormData();
        for (let fid in data) {
            if (fieldNames.includes(fid)) {
                console.log("fid: "+fid);
                let fieldData=data[fid];

                let type=this.collections[resource].fields[fid].type;
                let processor=FIELD_TYPES[type].writeProcessor;
                if (processor)
                    fieldData=processor(fieldData,this.conf);

                if (!(fieldData instanceof File)) {
                    if (fieldData)
                        fieldData=JSON.stringify(fieldData)

                    else
                        fieldData=null;
                }

                formData.append(fid,fieldData);
                //console.log("append done...");
            }
        }

        return formData;
    }

    getList=async (resource, params)=>{
        if (params.filter) {
            let filterKeys=Object.keys(params.filter);

            for (let filterKey of filterKeys) {
                if (this.collections[resource].fields[filterKey]) {
                    let field=this.collections[resource].fields[filterKey];
                    if (String(field.filter).includes("substr")) {
                        let filterQuery=params.filter[filterKey];
                        delete params.filter[filterKey]
                        params.filter[filterKey+"~"]=filterQuery;
                    }
                }
            }
        }

        let result=await this.simpleRestProvider.getList(resource,params);
        //console.log(result.data);
        for (let data of result.data)
            this.processRead(resource,data);

    	return result;
    }

    getOne=async (resource, params)=>{
        let url=`${this.apiUrl}/${resource}/${encodeURIComponent(params.id)}?includePolicyInfo=true&selectAllReadable=true`;
        let response={data: (await this.httpClient(url)).json};
        response.data=this.processRead(resource,response.data);

        //console.log(response.data);

    	return response;
    }

    getMany=async (resource, params)=>{
        let res=await this.simpleRestProvider.getMany(resource,params);

    	return res;
    }

    getManyReference=(resource, params)=>{
    	return this.simpleRestProvider.getManyReference(resource,params);
    }

    create=async (resource, params)=>{
        let createFields=this.collections[resource].getWideFieldSet("create");
        createFields=createFields.filter(f=>f!="id");

        let formData=this.createFormData(resource,params.data,createFields);
        let url=`${this.apiUrl}/${resource}`;
        let response=await this.httpClient(url,{
            method: 'POST',
            body: formData,
        });

        return {
            data: response.json
        }
    }

    update=async (resource, params)=>{
        let updateFields=params.data.$policyInfo.updateFields;
        updateFields=updateFields.filter(f=>f!="id");

        let data={...params.data};
        delete data.$policyInfo;

        let formData=this.createFormData(resource,data,updateFields);
        let url=`${this.apiUrl}/${resource}/${params.id}`;
        let response=await this.httpClient(url,{
            method: 'PUT',
            body: formData,
        });

        return {
            data: this.processRead(resource,response.json)
        }
    }

    updateMany=(resource, params)=>{
    	return this.simpleRestProvider.updateMany(resource,params);
    }

    delete=(resource, params)=>{
    	return this.simpleRestProvider.delete(resource,params);
    }

    deleteMany=(resource, params)=>{
    	return this.simpleRestProvider.deleteMany(resource,params);
    }
}