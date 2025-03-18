import { SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";

export default {
  config(_input) {
    return {
      name: "map-ev-chargers",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      const hostedZone = HostedZone.fromLookup(stack, 'HostedZone', {
        domainName: 'thundermeeting.com'
      });

      const site = new NextjsSite(stack, "site", {
        customDomain: {
          domainName: "maps.thundermeeting.com",
          domainAlias: "www.maps.thundermeeting.com",
          hostedZone: hostedZone.zoneName
        }
      });

      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;
