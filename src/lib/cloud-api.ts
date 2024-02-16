import { Injectable, StreamableFile } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import moment from 'moment';

@Injectable()
export class CloudApi {
  private static instance: CloudApi;
  private accessKey: string = process.env['NCP_ACCESS_KEY']; // '4XecRIcPEi8mL0FduCHm';
  private secretKey: string = process.env['NCP_SECRET_KEY']; // 'AdemCFxEvYkjATxLwPbKUgL2mJGrhjZLnr1WfWli';
  private endpoint: AWS.Endpoint = new AWS.Endpoint('https://'+ process.env['NCP_S3_ENDPOINT']);
  private region: string = process.env['NCP_REGION'];
  private S3: AWS.S3;
  private bucket: string = process.env['NCP_BUCKET'];
  
  //singleton api
  // public static getInstance = () => this.instance || (this.instance = new this());

  constructor() {
    //s3 초기화
    this.S3 = new AWS.S3({
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey,
      },
    });
  }
  
  /*************************************************
   * S3 버킷 인스턴스 가져오기
   ************************************************/
  public GetS3 = () => {
    return this.S3;
  };


  /*************************************************
   * S3 파일 가져오기
   ************************************************/
  public getS3Data = async (params: any) => {
    let { props } = params;
    let { path, fileName } = props;

    let data = [];
    try {

      const file = await this.GetS3().getObject({
        Bucket: this.bucket,
        Key: `${path}/${fileName}`
      }).createReadStream()
  
      file.on('error', (err) => {  });
  
      let fileStream = new StreamableFile(file)
      
      return  fileStream;
       
    } catch (error) {}
  };


  /*************************************************
   * S3 파일 가져오기
   ************************************************/
  public getS3DataStream = async (params: any) => {
    let { props } = params;
    let { path, fileName } = props;

    let data = [];
    try {

      const file = await this.GetS3().getObject({
        Bucket: this.bucket,
        Key: `${path}/${fileName}`
      }).createReadStream()
  
      file.on('error', (err) => {  });
  
      return  file;
       
    } catch (error) {}
  };


  /*************************************************
   * S3 파일 업로드
   ************************************************/
  public upload = async (path, file, acl = 'private') => {

    try {
      let timestamp = moment(new Date()).utc().format('x');
      let ext = file.originalname.split('.').pop();

      file.info = {
        originalFileName: Buffer.from(file.originalname, 'latin1').toString('utf8'), 
        saveFileName: `${timestamp}.${ext}`, 
        fileSize: file.size, 
        fileExtension: ext
      }
      
      const result = await this.GetS3().upload({
        Bucket: this.bucket,
        Key: `${path}/${file.info.saveFileName}`,
        Body: file.buffer,
        ACL: acl
      }).promise();

      return result;
    } catch (error) { }
  };


  /*************************************************
   * S3 파일 삭제
   ************************************************/
   public deleteObject = async (path, fileName) => {
    
    try {
      await this.GetS3().deleteObject({
        Bucket: this.bucket,
        Key: `${path}/${fileName}`
      }).promise();
    } catch (error) { }
  };

}