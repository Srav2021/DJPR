import {
    generateGUID
} from 'c/utility';

export default class ClientAddress {
    /**
     * get client Address
     * @param {addressId} addressId
     * @param {clientId} clientId 
     * @param {type} type
     */
    static createClientAddressWithIds(addressId, clientId, type){
        return {
            "Id": generateGUID(),
            "Client__c": clientId,
            "Address__c": addressId,
            "Address_Type__c": type
        };
    };
    
}