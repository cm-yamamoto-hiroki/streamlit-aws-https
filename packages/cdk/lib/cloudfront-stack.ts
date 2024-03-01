import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as congnito_alpha from '@aws-cdk/aws-cognito-identitypool-alpha';

interface CloudFrontStackProps extends StackProps {
  cloudfrontCustomHeaderName: string; // CloudFrontとALBの接続に使用する共有キーのヘッダー名
  cloudfrontCustomHeaderValue: string; // CloudFrontとALBの接続に使用する共有キー
  loadBalancerArn: string; // CloudFrontから接続する先のALBのARN
  loadBalancerSecurityGroupId: string; // CloudFrontから接続する先のALBのセキュリティグループID
  loadBalancerDnsName: string; // CloudFrontから接続する先のALBのDNS名
  allowedSignUpEmailDomains: string[]; // サインアップを許可するメールドメイン
  useCognitoAuth: boolean; // Cognitoを使用するかどうか
}

export class CloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    // ---------------------------------- Lambdaの定義 ----------------------------------
    let authFunction: NodejsFunction | undefined;
    if (props.useCognitoAuth) {
      authFunction = new NodejsFunction(this, 'AuthFunction', {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: './lambda/auth.js',
        handler: 'handler',
        timeout: Duration.seconds(5),
      });
    }

    // // add role to read ssm paremeter store value
    // authFunction.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: ['ssm:GetParameter'],
    //     resources: [
    //       `arn:aws:ssm:${this.region}:${this.account}:parameter/SecureContainer/*`,
    //       `arn:aws:ssm:${this.region}:${this.account}:parameter/SecureContainer/*`,
    //       `arn:aws:ssm:${this.region}:${this.account}:parameter/SecureContainer/*`,
    //     ],
    //   })
    // );

    // ---------------------------------- Cloudfrontの定義 ----------------------------------
    const loadBalancer = elb.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(
      this,
      'loadBalancer',
      {
        loadBalancerArn: props.loadBalancerArn,
        securityGroupId: props.loadBalancerSecurityGroupId,
        loadBalancerDnsName: props.loadBalancerDnsName,
      }
    );

    const defaultOrigin = new cloudfront_origins.LoadBalancerV2Origin(
      loadBalancer,
      {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        httpPort: 80,
        originId: 'defaultOrigin',
        customHeaders: {
          [props.cloudfrontCustomHeaderName]: props.cloudfrontCustomHeaderValue,
        },
      }
    );

    const distribution = new cloudfront.Distribution(this, 'distribution', {
      defaultBehavior: {
        origin: defaultOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        edgeLambdas: authFunction
          ? [
              {
                functionVersion: authFunction.currentVersion,
                eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
              },
            ]
          : undefined,
      },
    });

    // ---------------------------------- Cognitoの定義 ----------------------------------
    if (props.useCognitoAuth) {
      const userPool = new cognito.UserPool(this, 'UserPool', {
        selfSignUpEnabled: true,
        signInAliases: {
          username: false,
          email: true,
        },
        passwordPolicy: {
          requireUppercase: true,
          requireSymbols: true,
          requireDigits: true,
          minLength: 8,
        },
      });

      const userPoolDomain = new cognito.UserPoolDomain(
        this,
        'UserPoolDomain',
        {
          userPool,
          cognitoDomain: {
            domainPrefix: 'secure-container',
          },
        }
      );

      const client = new cognito.UserPoolClient(this, 'client', {
        userPool: userPool,
        idTokenValidity: Duration.days(1),
        oAuth: {
          callbackUrls: [`https://${distribution.distributionDomainName}`],
        },
      });

      const idPool = new congnito_alpha.IdentityPool(this, 'IdentityPool', {
        authenticationProviders: {
          userPools: [
            new congnito_alpha.UserPoolAuthenticationProvider({
              userPool,
              userPoolClient: client,
            }),
          ],
        },
      });

      const checkEmailDomainFunction = new NodejsFunction(
        this,
        'CheckEmailDomain',
        {
          runtime: lambda.Runtime.NODEJS_18_X,
          entry: './lambda/checkEmailDomain.ts',
          timeout: Duration.minutes(15),
          environment: {
            ALLOWED_SIGN_UP_EMAIL_DOMAINS_STR: JSON.stringify(
              props.allowedSignUpEmailDomains
            ),
          },
        }
      );

      userPool.addTrigger(
        cognito.UserPoolOperation.PRE_SIGN_UP,
        checkEmailDomainFunction
      );

      // const paramterCognitoUserPoolId = new ssm.StringParameter(
      //   this,
      //   'parameterCognitoUserPoolId',
      //   {
      //     parameterName: '/SecureContainer/cognito/userpool/id',
      //     stringValue: userPool.userPoolId,
      //   }
      // );
      // const paramterCognitoUserPoolDomain = new ssm.StringParameter(
      //   this,
      //   'parameterCognitoUserPoolDomain',
      //   {
      //     parameterName: '/SecureContainer/cognito/userpool/domain',
      //     stringValue: userPoolDomain.domainName,
      //   }
      // );
      // const paramterCognitoUserPoolClientId = new ssm.StringParameter(
      //   this,
      //   'parameterCognitoUserPoolClientId',
      //   {
      //     parameterName: '/SecureContainer/cognito/userpool/clientid',
      //     stringValue: client.userPoolClientId,
      //   }
      // );
    }

    new CfnOutput(this, 'WebUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
