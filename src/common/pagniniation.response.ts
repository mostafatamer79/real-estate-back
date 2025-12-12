export interface PagninationResponse <T> {
    data:T[];
    meta:{
        total:number,
        offset:number,
        limit:number
    }
}