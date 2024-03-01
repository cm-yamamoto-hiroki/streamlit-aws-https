#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { LoadbalancedContainerStack as LoadbalancedContainer } from '../lib/loadbalanced-container-stack';
import { CloudFrontStack } from '../lib/cloudfront-stack';
import * as util from '../lib/util';

const app = new cdk.App();

// .env ファイルの内容を process.env に読み込む
dotenv.config();

// 環境変数から値を取得
const cloudfrontAlbCustomHeaderValue_ =
  process.env.cloudfrontAlbCustomHeaderValue;
const cloudfrontAlbCustomHeaderValue = util.checkStringContext(
  'cloudfrontAlbCustomHeaderValue',
  cloudfrontAlbCustomHeaderValue_
);

// オプション設定を読み込む
const useCognitoAuth_ = app.node.tryGetContext('useCognitoAuth');
const useCognitoAuth = util.checkBooleanContext(
  'useCognitoAuth',
  useCognitoAuth_
);

const ecrRepogitoryName_ = app.node.tryGetContext('ecrRepogitoryName');
const ecrRepogitoryName = util.checkStringContext(
  'ecrRepogitoryName',
  ecrRepogitoryName_
);

const containerPort_ = app.node.tryGetContext('containerPort');
const containerPort = util.checkNumberContext('containerPort', containerPort_);

const containerHealthCheckPath_ = app.node.tryGetContext(
  'containerHealthCheckPath'
);
const containerHealthCheckPath = util.checkStringContext(
  'containerHealthCheckPath',
  containerHealthCheckPath_
);

const allowedSignUpEmailDomains_ = app.node.tryGetContext(
  'allowedSignUpEmailDomains'
);
const allowedSignUpEmailDomains = util.checkStringArrayContext(
  'allowedSignUpEmailDomains',
  allowedSignUpEmailDomains_
);

// スタックを作成する
const cloudfrontAlbCustomHeaderName = 'x-pre-shared-key';

const secureContainerStack = new LoadbalancedContainer(
  app,
  'StremlitAwsHttpsLoadbalancedContainerStack',
  {
    ecrRepogitoryName: ecrRepogitoryName,
    containerPort: containerPort,
    containerHealthCheckPath: containerHealthCheckPath,
    albCustomHeaderName: cloudfrontAlbCustomHeaderName,
    albCustomHeaderValue: cloudfrontAlbCustomHeaderValue,
    env: {
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

const cloudFrontStack = new CloudFrontStack(
  app,
  'StremlitAwsHttpsCloudFrontStack',
  {
    loadBalancerArn: secureContainerStack.loadBalancer.loadBalancerArn,
    loadBalancerSecurityGroupId:
      secureContainerStack.loadBalancer.connections.securityGroups[0]
        .securityGroupId,
    loadBalancerDnsName: secureContainerStack.loadBalancer.loadBalancerDnsName,
    allowedSignUpEmailDomains: allowedSignUpEmailDomains,
    useCognitoAuth: useCognitoAuth,
    cloudfrontCustomHeaderName: cloudfrontAlbCustomHeaderName,
    cloudfrontCustomHeaderValue: cloudfrontAlbCustomHeaderValue,
    env: {
      region: 'us-east-1',
    },
    crossRegionReferences: true,
  }
);
