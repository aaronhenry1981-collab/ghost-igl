"""Offline infrastructure regression: requires PyYAML, never contacts AWS."""
import unittest
from pathlib import Path
import yaml

class Loader(yaml.SafeLoader): pass
def intrinsic(loader, tag, node):
    return {tag: loader.construct_scalar(node)}
Loader.add_multi_constructor('!', intrinsic)
template = yaml.load((Path(__file__).resolve().parents[1]/'aws/template.yaml').read_text(), Loader=Loader)

class PolicyTest(unittest.TestCase):
    def test_vod_reservation_uses_bound_profile_table_and_only_point_operations(self):
        props=template['Resources']['VodFunction']['Properties']
        self.assertEqual(props['Environment']['Variables']['PROFILES_TABLE'], {'Ref':'ProfilesTable'})
        statements=[s for p in props['Policies'] for s in p.get('Statement',[])
                    if s.get('Sid')=='VodProfileUsageReservation']
        self.assertEqual(len(statements),1)
        self.assertEqual(statements[0], {'Sid':'VodProfileUsageReservation','Effect':'Allow',
            'Action':['dynamodb:GetItem','dynamodb:UpdateItem'],
            'Resource':{'GetAtt':'ProfilesTable.Arn'}})
    def test_subscription_conditional_updates_remain_authorized(self):
        policies=template['Resources']['VodFunction']['Properties']['Policies']
        self.assertTrue(any(s.get('Action')==['dynamodb:UpdateItem'] and
            s.get('Resource')=={'GetAtt':'SubscriptionsTable.Arn'}
            for p in policies for s in p.get('Statement',[])))

if __name__=='__main__': unittest.main()
