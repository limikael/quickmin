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
        for (let fid in this.collections[resource].fields) {
            let type=this.collections[resource].fields[fid].type;
            let processor=FIELD_TYPES[type].readProcessor;
            if (processor)
                data[fid]=processor(data[fid],this.conf);
        }

        return data;
    }

    createFormData(resource, data) {
        const formData=new FormData();
        for (let fid in data) {
            let fieldData=data[fid];

            if (fid!="id") {
                let type=this.collections[resource].fields[fid].type;
                let processor=FIELD_TYPES[type].writeProcessor;
                if (processor)
                    fieldData=processor(fieldData,this.conf);
            }

            if (!(fieldData instanceof File)) {
                if (fieldData)
                    fieldData=JSON.stringify(fieldData)

                else
                    fieldData=null;
            }

            formData.append(fid,fieldData);
        }

        return formData;
    }

    getList=(resource, params)=>{
        //console.log("get list...");

    	return this.simpleRestProvider.getList(resource,params);
    }

    getOne=async (resource, params)=>{
        //console.log("get one...");

        let response=await this.simpleRestProvider.getOne(resource,params);
        response.data=this.processRead(resource,response.data);
    	return response;
    }

    getMany=async (resource, params)=>{
        //console.log("get many...");
        //console.log("get many, res="+resource+" params=",params);

        /*return ({data:[{
                id: 1, name: "hello"
        }]});*/

        let res=await this.simpleRestProvider.getMany(resource,params);

        //console.log(res);

    	return res;
    }

    getManyReference=(resource, params)=>{
    	return this.simpleRestProvider.getManyReference(resource,params);
    }

    create=async (resource, params)=>{
        let formData=this.createFormData(resource,params.data)
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
        let formData=this.createFormData(resource,params.data)
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