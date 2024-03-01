import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecrp from 'aws-cdk-lib/aws-ecs-patterns';

interface LoadbalancedContainerStackProps extends StackProps {
  containerPort: number; // コンテナで受け付けるポート番号
  containerHealthCheckPath: string; // コンテナのヘルスチェックのパス
  ecrRepogitoryName: string; // ECRのリポジトリ名
  albCustomHeaderName: string; // CloudFrontとALBの接続に使用する共有キーのヘッダー名
  albCustomHeaderValue: string; // CloudFrontとALBの接続に使用する共有キーの値
}

export class LoadbalancedContainerStack extends Stack {
  public readonly loadBalancer: elb.ApplicationLoadBalancer;

  constructor(
    scope: Construct,
    id: string,
    props: LoadbalancedContainerStackProps
  ) {
    super(scope, id, props);

    // ---------------------------------- ECRの定義 ----------------------------------
    const repogitory = ecr.Repository.fromRepositoryName(
      this,
      'Repogitory',
      props.ecrRepogitoryName
    );

    // ---------------------------------- ECS・ALBの定義 ----------------------------------
    const service = new ecrp.ApplicationLoadBalancedFargateService(
      this,
      'Fargate',
      {
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        publicLoadBalancer: true,
        targetProtocol: elb.ApplicationProtocol.HTTP,
        protocol: elb.ApplicationProtocol.HTTP,
        assignPublicIp: true,
        // assignPublicIp: true,
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repogitory),
          enableLogging: true,
          containerPort: props.containerPort,
          // logDriver: ecs.LogDriver.awsLogs({
          //   streamPrefix: 'task-log',
          //   logRetention: RetentionDays.ONE_DAY,
          // }),
        },
        deploymentController: {
          type: ecs.DeploymentControllerType.ECS,
        },
      }
    );

    // ECSでのhealth checkパスを設定
    service.targetGroup.configureHealthCheck({
      path: props.containerHealthCheckPath,
    });

    // CloudFrontとの接続
    const listener = service.listener.node.defaultChild as elb.CfnListener;
    listener.defaultActions = [
      {
        type: 'fixed-response',
        fixedResponseConfig: {
          statusCode: '403',
          contentType: 'text/html',
          messageBody: '<h1>403 Forbidden</h1>',
        },
      },
    ];

    const listenerRule = new elb.CfnListenerRule(this, `listenerRule`, {
      actions: [
        {
          type: `forward`,
          targetGroupArn: service.targetGroup.targetGroupArn,
        },
      ],
      conditions: [
        {
          field: 'http-header',
          httpHeaderConfig: {
            httpHeaderName: props.albCustomHeaderName,
            values: [props.albCustomHeaderValue],
          },
        },
      ],
      listenerArn: listener.ref,
      priority: 1,
    });

    this.loadBalancer = service.loadBalancer;
  }
}
